{{- define "ray.io/RayJob.resources" }}
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
