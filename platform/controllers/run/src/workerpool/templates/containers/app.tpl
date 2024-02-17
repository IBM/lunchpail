{{- define "codeflare.dev/containers/app" }}
- name: app
  image: {{ .Values.image }}
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
{{- end }}
