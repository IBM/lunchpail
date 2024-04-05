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

    # TODO... how do we really want to get a good name for the app?
    if [[ $appname = "pail" ]]
    then appname=${4-$(basename $(dirname ${appgit%%.git}))}
    fi

    local appdir=$target/templates
    mkdir -p $appdir

    if [[ $appgit =~ "git@" ]]
    then
        if [[ -n "$AI_FOUNDATION_GITHUB_PAT" ]] && echo $appgit | grep -Eq "^git@"
        then
            # git@github.ibm.com:user/repo.git -> https://patuser:pat@github.ibm.com/user/repo.git
            local apphttps=$(echo $appgit | sed -E "s#^git\@([^:]+):([^/]+)/([^.]+)[.]git\$#https://${AI_FOUNDATION_GITHUB_USER}:${AI_FOUNDATION_GITHUB_PAT}@\1/\2/\3.git#")
            (cd $appdir && git clone $QUIET $apphttps $appbranch $appname)
        else
            (cd $appdir && git clone QUIET $appgit $appbranch $appname)
        fi
    else
        mkdir -p $appdir/$appname
        tar --exclude '*~' -C $appgit -cf - . | tar -C $appdir/$appname -xf -
    fi
    
    pushd $appdir >& /dev/null

    if [[ -d $appdir/$appname/src ]]
    then
        mkdir -p $target/src/
        mv $appdir/$appname/src/* $target/src
    fi

    if [[ -f $appdir/$appname/values.yaml ]]
    then
        cat $appdir/$appname/values.yaml >> $target/values.yaml
        rm -f $appdir/$appname/values.yaml
    fi

    popd >& /dev/null

    APP_NAME=$appname
}

function shrink_core {
    (cd "$TOP"/platform && ./prerender.sh)
    if [[ -z "$HELM_DEPENDENCY_DONE" ]]
    then
        (cd "$TOP"/platform && helm dependency update . \
           2> >(grep -v 'found symbolic link' >&2) \
           2> >(grep -v 'Contents of linked' >&2))
        # Note re: the 2> stderr filters below. scheduler-plugins as of 0.27.8
        # has symbolic links :( and helm warns us about these
    fi

    local CORE_YAML="$OUTDIR"/02-jaas.yml
    
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
        --set global.jaas.namespace.create=true \
        2> >(grep -v 'found symbolic link' >&2) \
        2> >(grep -v 'Contents of linked' >&2) \
        > "$CORE_YAML"

    # the kuberay-operator chart has some problems with namespaces; ensure
    # that we force everything in core into $NAMESPACE_SYSTEM
    if [[ -z "$LITE" ]]
    then echo "$NAMESPACE_SYSTEM" > "${CORE_YAML%%.yml}.namespace"
    fi
}

function shrink_user {
    local userdir=$1
    local appname=$2
    local ns=$appname # namespace=application name

    if ! grep -qr '^kind:\s*Run$' $userdir/templates/$appname
    then
        echo "$(tput setaf 5)Auto-Injecting WorkStealer startup$(tput sgr0)"
        local helm_auto_run="--set autorun=$appname"
    fi

    if ! grep -qr '^kind:\s*WorkDispatcher$' $userdir/templates/$appname && \
            grep -qr '^  role:\s*dispatcher$' $userdir/templates/$appname
    then
        echo "$(tput setaf 5)Auto-Injecting WorkDispatcher$(tput sgr0)"
        local helm_auto_dispatcher="--set autodispatcher.name=$appname --set autodispatcher.application=$appname"
    fi

    local APP_YAML="$OUTDIR"/"$appname".yml

    $HELM_TEMPLATE \
        "$appname" \
        "$userdir" \
        $HELM_SECRETS \
        $HELM_DEMO_SECRETS $HELM_INSTALL_FLAGS \
        $HELM_IMAGE_PULL_SECRETS \
        $helm_auto_run \
        $helm_auto_dispatcher \
        --set namespace.user="$ns" \
        2> >(grep -v 'found symbolic link' >&2) \
        2> >(grep -v 'Contents of linked' >&2) \
        > "$APP_YAML"

    echo "$ns" > "${APP_YAML%%.yml}.namespace"
}
