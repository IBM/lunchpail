{{- define "ray.io/PodGroup" }}
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: ray
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
spec:
  minMember: {{ add 1 .Values.workers.count }}
{{- end }}
