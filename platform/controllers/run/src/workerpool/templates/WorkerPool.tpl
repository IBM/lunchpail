{{- define "codeflare.dev/WorkerPool" }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ print .Release.Name | trunc 53 }}
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
  ttlSecondsAfterFinished: 1000
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
      terminationGracePeriodSeconds: 10 # the s3-syncer has a 5-second poll
      serviceAccountName: {{ .Values.rbac.serviceaccount }}
      volumes:
        {{ include "rclone.volume" . | indent 8 }}
        {{- include "codeflare.dev/queue.volume" . | indent 8 }}
        {{- include "codeflare.dev/workdir.volume" . | indent 8 }}
      initContainers:
        {{- include "containers/workdir" . | indent 8 }}
      containers:
        {{- include "containers/app" . | indent 8 }}
        {{- include "containers/syncer" . | indent 8 }}
{{- end }}
