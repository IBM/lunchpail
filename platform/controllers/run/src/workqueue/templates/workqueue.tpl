{{- define "codeflare.dev/WorkQueue" }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: workqueue
    app.kubernetes.io/part-of: {{ .Values.partOf }}
    app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: codeflare.dev
spec:
  completions: {{ .Values.nWorkers }}
  completionMode: Indexed
  template:
    metadata:
      labels:
        app.kubernetes.io/component: workqueue
        app.kubernetes.io/part-of: {{ .Values.partOf }}
        app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
        app.kubernetes.io/name: {{ .Values.name }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        app.kubernetes.io/managed-by: codeflare.dev
    spec:
      restartPolicy: OnFailure
      serviceAccountName: {{ .Release.Name }}
      containers:
        - name: main
          image: {{ .Values.image }}
          env:
            - name: NAME
              value: {{ .Release.Name }}
            - name: NAMESPACE
              value: {{ .Values.namespace }}
            - name: ENCLOSING_UID
              value: {{ .Values.uid }}
            - name: ENCLOSING_RUN_NAME
              value: {{ .Values.name }}
{{- end }}
