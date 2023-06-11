{
    print $0;
    if ($0=="kind: AppWrapper") {
        getline;
        print $0;
        print "  labels:";
        print "    app.kubernetes.io/name:", name;
        print "    app.kubernetes.io/part-of:", name;
        print "    app.kubernetes.io/managed-by: codeflare.dev";
        print "  ownerReferences:";
        print "    - apiVersion: codeflare.dev/v1alpha1";
        print "      controller: true";
        print "      kind: Run";
        print "      name:", name;
        print "      uid:", uid;
    }
}
