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
  ttlSecondsAfterFinished: 10000
  backoffLimit: 6
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
      # see
      # https://stackoverflow.com/questions/54091659/kubernetes-pods-disappear-after-failed-jobs#comment133585091_54165455
      # "when Restart=Never and backoffLimit>1 then a separately named
      # pod (different random 5 digit extension) will stay around for
      # each failure, allowing you to go back and review each"
      restartPolicy: Never

      terminationGracePeriodSeconds: 20 # give time for the preStop in the syncer container
      serviceAccountName: {{ .Values.rbac.serviceaccount }}
      volumes:
        {{- if .Values.volumes }}
        {{- .Values.volumes | b64dec | fromJsonArray | toYaml | nindent 8 }}
        {{- end }}
        {{ include "rclone.volume" . | indent 8 }}
        {{- include "codeflare.dev/queue.volume" . | indent 8 }}
        {{- include "codeflare.dev/workdir.volume" . | indent 8 }}
        {{- include "watcher.volume" . | indent 8 }}
      initContainers:
        {{- include "containers/workdir" . | indent 8 }}
      containers:
        {{- include "containers/app" . | indent 8 }}
        {{- include "containers/syncer" . | indent 8 }}
{{- end }}
