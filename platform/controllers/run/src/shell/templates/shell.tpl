{{- define "codeflare.dev/Shell" }}
apiVersion: v1
kind: Pod
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
    {{ if .Values.datasets }}
{{ .Values.datasets | b64dec | indent 4 }}
    {{ end }}
spec:
  restartPolicy: OnFailure
  serviceAccountName: {{ .Values.rbac.serviceaccount }}
  volumes:
    {{- if .Values.volumes }}
    {{- .Values.volumes | b64dec | fromJsonArray | toYaml | nindent 4 }}
    {{- end }}
    {{- include "rclone.volume" . | indent 4 }}
    {{- include "codeflare.dev/workdir.volume" . | indent 4 }}
  initContainers:
    {{- include "containers/workdir" . | indent 4 }}
  containers:
    {{- include "containers/main" . | indent 4 }}
{{- end }}
