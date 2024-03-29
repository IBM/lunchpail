while getopts "x:" opt
do
    case $opt in
        x) X="${OPTARG}"; continue;;
    esac
done
shift $((OPTIND-1))

echo "PASS: Shell Application test6 idx=$JOB_COMPLETION_INDEX x=\"$X\" rest=\"$@\" xxx=$xxx yyy=$yyy"
