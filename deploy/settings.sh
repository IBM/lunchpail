PLA=$(grep name platform/deploy/Chart.yaml | awk '{print $2}')
IBM=$(grep name ibm/Chart.yaml | awk '{print $2}')
RUN=$(grep name tests/run/Chart.yaml | awk '{print $2}')

RUN_IMAGE=codeflare-run-controller:dev

# for local testing
LOCAL_CLUSTER_NAME=codeflare-platform

while getopts "k:" opt
do
    case $opt in
        k) NO_KIND=true; export KUBECONFIG=${OPTARG}; continue;;
    esac
done
shift $((OPTIND-1))

