{{- define "containers/app" }}
- name: app
  image: {{ .Values.image.app }}
  command: ["/bin/bash", "-c", {{ print "/usr/local/bin/watcher.sh " .Values.command  }}]
  env:
    {{- include "queue/env" . | indent 4 }}

  {{- if .Values.env }}
  envFrom:
  - configMapRef:
      name: {{ print .Release.Name "-env" | trunc 53 }}
  {{- end }}

  {{- include "workdir/path" . | indent 2 }}
  volumeMounts:
    {{- if .Values.volumeMounts }}
    {{- .Values.volumeMounts | b64dec | fromJsonArray | toYaml | nindent 4 }}
    {{- end }}
    {{- include "queue/volumeMount" . | indent 4 }}
    {{- include "workdir/volumeMount" . | indent 4 }}
    {{- include "watcher/volumeMount" . | indent 4 }}
  resources:
    limits:
      cpu: {{ .Values.workers.cpu }}
      memory: {{ .Values.workers.memory }}
      {{- if and (.Values.workers.gpu) (gt .Values.workers.gpu 0) }}
      nvidia.com/gpu: {{ .Values.workers.gpu }}
      {{- end }}
    requests:
      cpu: {{ .Values.workers.cpu }}
      memory: {{ .Values.workers.memory }}
      {{- if and (.Values.workers.gpu) (gt .Values.workers.gpu 0) }}
      nvidia.com/gpu: {{ .Values.workers.gpu }}
      {{- end }}

  {{- if .Values.rbac.runAsRoot }}
  securityContext:
    privileged: true
  {{- end }}
{{- end }}
