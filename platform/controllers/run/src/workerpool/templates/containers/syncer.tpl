{{- define "containers/syncer" }}
- name: syncer
  image: {{ print .Values.image.registry "/" .Values.image.repo "/jaas-s3-syncer-component:" .Values.image.version }}
  env:
    - name: LUNCHPAIL_STARTUP_DELAY
      value: {{ .Values.startupDelay | default 0 | quote }}
    {{- include "codeflare.dev/queue.env" . | indent 4 }}
    {{- include "codeflare.dev/queue.env.dataset" . | indent 4 }}
  volumeMounts:
    {{- include "codeflare.dev/queue.volumeMount" . | indent 4 }}
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
{{- end }}
