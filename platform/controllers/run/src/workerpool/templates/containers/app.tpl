{{- define "containers/app" }}
- name: app
  image: {{ .Values.image.app }}
  command: ["/bin/bash", "-c", {{ .Values.command | quote }}]
  env:
    {{- include "codeflare.dev/queue.env" . | indent 4 }}

  {{- if .Values.env }}
  envFrom:
  - configMapRef:
      name: {{ print .Release.Name "-env" | trunc 53 }}
  {{- end }}

  {{- include "codeflare.dev/workdir.path" . | indent 2 }}
  volumeMounts:
    {{- if .Values.volumeMounts }}
    {{- .Values.volumeMounts | b64dec | fromJsonArray | toYaml | nindent 4 }}
    {{- end }}
    {{- include "codeflare.dev/queue.volumeMount" . | indent 4 }}
    {{- include "codeflare.dev/workdir.volumeMount" . | indent 4 }}
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
