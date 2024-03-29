#
# Add one directory of script helpers to the shrinkwrap. We may have
# subdirectories, hence we recurse.
#
function add_dir {
    local indir=$1
    local outdir="$2"
    local appname=$3
    mkdir -p "$outdir"

    for f in "$indir"/*
    do
        if [[ "$f" =~ "~" ]]
        then continue
        elif [[ -f "$f" ]]
        then
            local in="$f"
            local out="$outdir"/$(basename "${f%%.sh}")

            cat "$in" | \
                sed "s#kubectl#$KUBECTL#g" | \
                sed "s#the_lunchpail_app#$appname#g" | \
                sed "s#jaas-user#$NAMESPACE_USER#g" | \
                sed "s#jaas-system#$NAMESPACE_SYSTEM#g" | \
                sed "s#\$ARCH#$ARCH#g" \
                    > "$out"

            if [[ "$f" =~ ".sh" ]]
            then chmod +x "$out"
            fi
        elif [[ -d "$1" ]]
        then add_dir "$f" "$outdir"/"$(basename $f)"
        fi
    done
}

function copy_app {
    local target=$1
    local appgit=$2
    local appbranch=$3
    local appname=${4:-$(basename ${appgit%%.git})}

    local appdir=$target/templates
    mkdir -p $appdir

    if [[ $appgit =~ "git@" ]]
    then
        if [[ -n "$AI_FOUNDATION_GITHUB_PAT" ]] && echo $appgit | grep -Eq "^git@"
        then
            # git@github.ibm.com:user/repo.git -> https://patuser:pat@github.ibm.com/user/repo.git
            local apphttps=$(echo $appgit | sed -E "s#^git\@([^:]+):([^/]+)/([^.]+)[.]git\$#https://${AI_FOUNDATION_GITHUB_USER}:${AI_FOUNDATION_GITHUB_PAT}@\1/\2/\3.git#")
            (cd $appdir && git clone $apphttps $appbranch $appname)
        else
            (cd $appdir && git clone $appgit $appbranch $appname)
        fi
    else
        mkdir -p $appdir/$appname
        tar -C $appgit -cf - . | tar -C $appdir/$appname -xf -
    fi
    
    pushd $appdir

    if [[ -d $appdir/$appname/src ]]
    then
        mkdir -p $target/src/
        mv $appdir/$appname/src $target/src/$appname
    fi

    if [[ -f $appdir/$appname/values.yaml ]]
    then
        cat $appdir/$appname/values.yaml >> $target/values.yaml
        rm -f $appdir/$appname/values.yaml
    fi
    
    popd

    APP_NAME=$appname
}

function shrink_core {
    # prereqs that the core depends on
    $HELM_TEMPLATE \
        --include-crds \
        $NAMESPACE_SYSTEM \
        -n $NAMESPACE_SYSTEM \
        "$TOP"/platform \
        $HELM_DEMO_SECRETS \
        $HELM_INSTALL_FLAGS \
        --set global.jaas.namespace.create=true \
        --set tags.full=false \
        --set tags.core=false \
        --set tags.prereqs1=true \
        --set tags.defaults=false \
        --set tags.default-user=false \
        2> >(grep -v 'found symbolic link' >&2) \
        2> >(grep -v 'Contents of linked' >&2) \
        > "$PREREQS1"

    # core deployment
    $HELM_TEMPLATE \
        --include-crds \
        $NAMESPACE_SYSTEM \
        -n $NAMESPACE_SYSTEM \
        "$TOP"/platform \
        $HELM_DEMO_SECRETS \
        $HELM_IMAGE_PULL_SECRETS \
        $HELM_INSTALL_FLAGS \
        --set tags.full=$JAAS_FULL \
        --set tags.core=true \
        --set tags.prereqs1=false \
        --set tags.defaults=false \
        --set tags.default-user=false \
        2> >(grep -v 'found symbolic link' >&2) \
        2> >(grep -v 'Contents of linked' >&2) \
        > "$CORE"

    # the kuberay-operator chart has some problems with namespaces; ensure
    # that we force everything in core into $NAMESPACE_SYSTEM
    echo "$NAMESPACE_SYSTEM" > "${CORE%%.yml}.namespace"

    # defaults
    $HELM_TEMPLATE \
        jaas-defaults \
        -n $NAMESPACE_SYSTEM \
        "$TOP"/platform \
        $HELM_INSTALL_FLAGS \
        --set tags.full=false \
        --set tags.core=false \
        --set tags.prereqs1=false \
        --set tags.defaults=true \
        --set tags.default-user=false \
        2> >(grep -v 'found symbolic link' >&2) \
        2> >(grep -v 'Contents of linked' >&2) \
        > "$DEFAULTS"
}

function shrink_user {
    local userdir=$1

    # default-user
    $HELM_TEMPLATE \
        jaas-default-user \
        "$userdir" \
        $HELM_SECRETS \
        $HELM_DEMO_SECRETS $HELM_INSTALL_FLAGS \
        $HELM_IMAGE_PULL_SECRETS \
        --set tags.default-user=true \
        2> >(grep -v 'found symbolic link' >&2) \
        2> >(grep -v 'Contents of linked' >&2) \
        > "$DEFAULT_USER"
}
