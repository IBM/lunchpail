{{- define "codeflare.dev/Shell" }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: shell
    app.kubernetes.io/part-of: {{ .Values.partOf }}
    app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: codeflare.dev
spec:
  completions: {{ .Values.workers.count }}
  completionMode: Indexed
  ttlSecondsAfterFinished: 86400
  template:
    metadata:
      labels:
        app.kubernetes.io/component: shell
        app.kubernetes.io/part-of: {{ .Values.partOf }}
        app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
        app.kubernetes.io/name: {{ .Values.name }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        app.kubernetes.io/managed-by: codeflare.dev
        {{ if .Values.datasets }}
{{ .Values.datasets | b64dec | indent 8 }}
        {{ end }}
    spec:
      restartPolicy: OnFailure
      serviceAccountName: {{ .Values.rbac.serviceaccount }}
      volumes:
        {{- include "rclone.volume" . | indent 8 }}
        {{- include "codeflare.dev/workdir.volume" . | indent 8 }}
      initContainers:
        {{- include "containers/workdir" . | indent 8 }}
      containers:
        {{- include "containers/main" . | indent 8 }}
{{- end }}
