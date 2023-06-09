{{- define "ray.io/RayJob.logging.volumes" }}
- name: ray-logs
  emptyDir: {}
- name: logging-policy-debug
  configMap:
    name: {{ print .Values.fluentbit.configmap_name "-debug" }}
- name: logging-policy-app
  configMap:
    name: {{ print .Values.fluentbit.configmap_name "-app" }}
{{- end }}

{{- define "ray.io/RayJob.logging.volumeMounts" }}
- mountPath: /tmp/ray
  name: ray-logs
{{- end }}

{{- define "ray.io/RayJob.logging.container" }}
- name: job-logs
  image: fluent/fluent-bit:1.9.6
  # These resource requests for Fluent Bit should be sufficient in production.
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 100m
      memory: 128Mi
  volumeMounts:
  {{- include "ray.io/RayJob.logging.volumeMounts" . | indent 2 }}
  - mountPath: /fluent-bit/etc/fluent-bit.conf
    subPath: fluent-bit.conf
    name: logging-policy-app

- name: ray-debug
  image: fluent/fluent-bit:1.9.6
  # These resource requests for Fluent Bit should be sufficient in production.
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 100m
      memory: 128Mi
  volumeMounts:
  {{- include "ray.io/RayJob.logging.volumeMounts" . | indent 2 }}
  - mountPath: /fluent-bit/etc/fluent-bit.conf
    subPath: fluent-bit.conf
    name: logging-policy-debug
{{- end }}

{{- define "ray.io/RayJob.logging.configmap.debug" }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ print .Values.fluentbit.configmap_name "-debug" }}
  namespace: {{ .Values.namespace }}
data:
  fluent-bit.conf: |
    [INPUT]
        Name tail
        Path /tmp/ray/session_latest/logs/*
        Exclude_Path {{ print "*" .Release.Name "*" }}
        Tag ray
        Path_Key true
        Refresh_Interval 5
    [OUTPUT]
        Name stdout
        Match *
{{- end }}

{{- define "ray.io/RayJob.logging.configmap.app" }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ print .Values.fluentbit.configmap_name "-app" }}
  namespace: {{ .Values.namespace }}
data:
  fluent-bit.conf: |
    [INPUT]
        Name tail
        Path {{ print "/tmp/ray/session_latest/logs/*" .Release.Name "*" }}
        Refresh_Interval 1
    [OUTPUT]
        Name stdout
        Match *
{{- end }}
