{{- define "job" }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: sequence
    app.kubernetes.io/part-of: {{ .Values.partOf }}
    app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: lunchpail.io
spec:
  parallelism: 1
  completions: {{ .Values.nSteps }}
  completionMode: Indexed
  template:
    metadata:
      labels:
        app.kubernetes.io/component: sequence
        app.kubernetes.io/part-of: {{ .Values.partOf }}
        app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
        app.kubernetes.io/name: {{ .Values.name }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        app.kubernetes.io/managed-by: lunchpail.io
    spec:
      restartPolicy: OnFailure
      serviceAccountName: {{ .Release.Name }}
      containers:
        - name: main
          image: {{ print .Values.image.registry "/" .Values.image.repo "/jaas-sequence-component:" .Values.image.version }}
          env:
            - name: NAME
              value: {{ .Release.Name }}
            - name: NAMESPACE
              value: {{ .Values.namespace }}
            - name: CODEFLARE_SEQUENCE_LENGTH
              value: {{ .Values.nSteps | quote }}
            - name: ENCLOSING_UID
              value: {{ .Values.uid }}
            - name: ENCLOSING_RUN_NAME
              value: {{ .Values.name }}
            - name: CODEFLARE_APPS_IN_SEQUENCE
              value: {{ .Values.applicationNames | b64dec }}
{{- end }}
