#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

while getopts "i" opt
do
    case $opt in
        i) INTERACTIVE=true; continue;; # don't run tests, just stand up and prepare VM
    esac
done
shift $((OPTIND-1))

echo "apikey=$apikey" 1>&2
echo "resource_group=$resource_group" 1>&2
echo "vpc_id=$vpc_id" 1>&2
echo "ssh_key_id=$ssh_key_id" 1>&2
echo "subnet_id=$subnet_id" 1>&2
echo "security_group_id=$security_group_id" 1>&2
echo "ssh_key=$ssh_key" 1>&2

function cleanup {
    if [[ -n "$GPU_CONFIG" ]]
    then
        if [[ -n "$INTERACTIVE" ]]
        then
            echo "apikey=$apikey \"$SCRIPTDIR\"/../../hack/ibmcloud/delete_vm.sh '$GPU_CONFIG'"
        else
            "$SCRIPTDIR"/../../hack/ibmcloud/delete_vm.sh "$GPU_CONFIG"
            rm -f /tmp/gpu-config.json
        fi
    fi
}

if [[ -n $apikey ]] && [[ -n $resource_group ]] && [[ -n $vpc_id ]] && [[ -n $ssh_key_id ]] && [[ -n $subnet_id ]] && [[ -n $security_group_id ]] && [[ -n $ssh_key ]]; then
    echo "Standing up gpus" 1>&2
    GPU_CONFIG=$("$SCRIPTDIR"/../../hack/ibmcloud/create_vm.sh) || exit 1
    echo "$GPU_CONFIG" > /tmp/gpu-config.json
    trap cleanup EXIT

    ip=$(echo -n "$GPU_CONFIG" | jq -r .ip)

    mkdir /tmp/.ssh
    chmod 700 /tmp/.ssh
    echo -n "$ssh_key" | base64 -d > /tmp/.ssh/gpu_ssh.prv
    chmod 600 /tmp/.ssh/gpu_ssh.prv

    while true; do
        echo "Attempting to validate $ip with ssh" 1>&2
        ssh-keyscan -T20 $ip >> $HOME/.ssh/known_hosts && break
        sleep 2
    done

    # bundle up the current platform code
    # re: COPYFILE_DISABLE=1 this disables mac metadata
    COPYFILE_DISABLE=1 tar -C "$SCRIPTDIR/../.." \
        -zcf /tmp/cfp.tar.gz \
        --exclude '*~' \
        --exclude '*.git' \
        --exclude '*.travis' \
        --exclude '*pycache*' \
        --exclude './console' \
        --exclude './data' \
        .

    # and then ship it to the remote host
    scp -i /tmp/.ssh/gpu_ssh.prv -r /tmp/cfp.tar.gz root@$ip:

    # next, log in to the remote host and initialize things; a reboot is needed to finish nvidia gpu driver init
    echo "Initializing remote host" 1>&2
    ssh -t -t -i /tmp/.ssh/gpu_ssh.prv root@$ip "function cleanup { touch /tmp/cleanup1; export apikey=$apikey; ~/cfp/hack/ibmcloud/delete_vm.sh '${GPU_CONFIG}' >& /tmp/delete_vm.out; }; trap cleanup EXIT; export NO_KUBEFLOW=1; mkdir cfp && cd cfp && tar zxf ../cfp.tar.gz && ./hack/init.sh && touch /tmp/untrapped && trap - EXIT; touch /tmp/rebooted; reboot"
    code=$?
    if [[ $code != 0 ]] && [[ $code != 255 ]]; then
        # 255 from reboot
       echo "Failed to initialize remote host due to exit code $code" 1>&2
       exit $code
    fi

    # wait till the host comes back...
    while true; do
        echo "Waiting for remote host to come back up after reboot" 1>&2
        ssh -i /tmp/.ssh/gpu_ssh.prv root@$ip "echo hi" && break
        sleep 1
    done

    if [[ -n "$INTERACTIVE" ]]
    then
        # if we are interactive mode, make sure to set this for
        # inotify. otherwise the nvidia installation fails.
        ssh -i /tmp/.ssh/gpu_ssh.prv root@$ip "sudo sysctl fs.inotify.max_user_instances=8192"
    else
        echo "Executing tests on remote host" 1>&2
        ssh -t -t -i /tmp/.ssh/gpu_ssh.prv root@$ip "function cleanup { export apikey=$apikey; ~/cfp/hack/ibmcloud/delete_vm.sh '${GPU_CONFIG}' >& /tmp/delete_vm.out; exit 0; }; trap cleanup EXIT; export NO_KUBEFLOW=1; sudo sysctl fs.inotify.max_user_instances=8192; cd cfp; ./tests/bin/test.sh; code=$?; echo \"Remote gpu tests finished with code=$code (this message is from the remote host)\"; trap - EXIT; exit $code"
        code=$?
        echo "Remote gpu tests finished with code=$code (this message is from the main test/CI host)" 1>&2

        if [[ $code = 255 ]]; then
            # ssh errors?
            exit 0
        else
            exit $code
        fi
    fi
fi
