{{- define "codeflare.dev/KubeFlowPodGroup" }}
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: kubeflow
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/part-of: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
spec:
  minMember: 1
{{- end }}
