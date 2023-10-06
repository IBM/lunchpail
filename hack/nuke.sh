if which podman >& /dev/null
then
    echo "This will nuke all built images, as well!"
    echo "You will be given a second chance to cancel, once the podman machine is stopped."
    read -p "Are you sure? [y/N] " -n 1 -r
    echo    # (optional) move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        podman machine stop
        podman machine rm
    fi
fi

