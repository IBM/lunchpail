{{- define "codeflare.dev/WorkerPool" }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: workerpool
    app.kubernetes.io/part-of: {{ .Values.partOf }}
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: codeflare.dev
spec:
  parallelism: {{ .Values.workers.count }}
  completions: {{ .Values.workers.count }}
  completionMode: Indexed
  ttlSecondsAfterFinished: 10
  template:
    metadata:
      labels:
        app.kubernetes.io/component: workerpool
        app.kubernetes.io/part-of: {{ .Values.partOf }}
        app.kubernetes.io/name: {{ .Values.name }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        app.kubernetes.io/managed-by: codeflare.dev
        {{ if .Values.datasets }}
{{ .Values.datasets | b64dec | indent 8 }}
        {{ end }}
    spec:
      restartPolicy: OnFailure
      terminationGracePeriodSeconds: 0
      volumes:
        {{- include "codeflare.dev/queue.volume" . | indent 8 }}
        {{- include "codeflare.dev/workdir.volume" . | indent 8 }}
      containers:
        {{- include "codeflare.dev/containers/app" . | indent 8 }}
        {{- include "codeflare.dev/containers/syncer" . | indent 8 }}
{{- end }}
