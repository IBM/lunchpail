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
      {{- if ne (.Values.workers.cpu | quote) "\"auto\"" }}
      cpu: {{ .Values.workers.cpu }}
      {{- end }}
      {{- if ne (.Values.workers.memory | quote) "\"auto\"" }}
      memory: {{ .Values.workers.memory }}
      {{- end }}
      {{- if and (.Values.workers.gpu) (gt .Values.workers.gpu 0) }}
      nvidia.com/gpu: {{ .Values.workers.gpu }}
      {{- end }}
    requests:
      {{- if ne (.Values.workers.cpu | quote) "\"auto\"" }}
      cpu: {{ .Values.workers.cpu }}
      {{- end }}
      {{- if ne (.Values.workers.memory | quote) "\"auto\"" }}
      memory: {{ .Values.workers.memory }}
      {{- end }}
      {{- if and (.Values.workers.gpu) (gt .Values.workers.gpu 0) }}
      nvidia.com/gpu: {{ .Values.workers.gpu }}
      {{- end }}

  {{- if .Values.rbac.runAsRoot }}
  securityContext:
    privileged: true
  {{- end }}
{{- end }}
