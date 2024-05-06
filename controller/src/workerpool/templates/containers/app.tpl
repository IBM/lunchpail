{{- define "containers/app" }}
- name: app
  image: {{ .Values.image.app }}
  command: ["/bin/bash", "-c", {{ print "/opt/lunchpail/bin/watcher.sh " .Values.command  }}]
  env:
    - name: LUNCHPAIL_STARTUP_DELAY
      value: {{ .Values.startupDelay | default 0 | quote }}
    - name: POD_NAME
      valueFrom:
        fieldRef:
          fieldPath: metadata.name
    {{- include "queue/env" . | indent 4 }}
    {{- include "queue/env/dataset" . | indent 4 }}

  {{- if or .Values.env .Values.envFroms }}
  envFrom:
  {{- if or .Values.env }}
  - configMapRef:
      name: {{ print .Release.Name "-env" | trunc 53 }}
  {{- end }}
  {{- if .Values.envFroms }}
  {{ .Values.envFroms | b64dec | fromJsonArray | toYaml | nindent 2 }}
  {{- end }}
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

  lifecycle:
      preStop:
          exec:
            command: ["/bin/sh", "-c", "/opt/lunchpail/bin/prestop.sh >& /tmp/prestop.out"]
            
  {{- if .Values.rbac.runAsRoot }}
  securityContext:
    privileged: true
  {{- end }}
{{- end }}
