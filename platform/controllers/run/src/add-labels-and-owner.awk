BEGIN {
    # BSD awk does not like newlines in strings
    datasets = ARGV[1]
    delete ARGV[1]

    nDatasetLines = split(datasets, datasetLines, "\n")
}

{
    print $0;
    if ($0=="kind: AppWrapper") {
        getline;
        print $0;
        print "  labels:";
        print "    app.kubernetes.io/name:", name;
        print "    app.kubernetes.io/part-of:", name;
        print "    app.kubernetes.io/managed-by: lunchpail.io";
        print "  ownerReferences:";
        print "    - apiVersion: lunchpail.io/v1alpha1";
        print "      controller: true";
        print "      kind: Run";
        print "      name:", name;
        print "      uid:", uid;
    } else if (nDatasetLines > 0 && $1 == "app.kubernetes.io/name:") {
        nWhitespace = index($0, "app.kubernetes.io/name:")
        for (idx = 1; idx <= nDatasetLines; idx++) {
            for (jdx = 1; jdx < nWhitespace; jdx++) {
                printf " ";
            }
            print datasetLines[idx];
        }
    }
}
