{{- define "codeflare.dev/Spark" }}
apiVersion: "sparkoperator.k8s.io/v1beta2"
kind: SparkApplication
metadata:
  name: {{ .Release.Name | trunc 30 }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/managed-by: codeflare.dev
    app.kubernetes.io/component: spark
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/part-of: {{ .Values.partOf }}
    app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
    scheduling.x-k8s.io/pod-group: {{ .Release.Name }}
    {{ if .Values.datasets }}
{{ .Values.datasets | b64dec | indent 4 }}
    {{ end }}
spec:
  type: {{ .Values.type }}
  pythonVersion: "3"
  mode: cluster
  image: {{ .Values.image }}
  imagePullPolicy: IfNotPresent
  mainApplicationFile: {{ print "local:///workdir/" .Values.mainFile }}
  sparkVersion: "3.1.1"
  volumes:
    # You set volumes at the Pod level, then mount them into containers inside that Pod
    {{- include "codeflare.dev/workdir.volume" . | indent 4 }}
  restartPolicy:
    type: OnFailure
    onFailureRetries: 3
    onFailureRetryInterval: 10
    onSubmissionFailureRetries: 5
    onSubmissionFailureRetryInterval: 20
  sparkConf:    
    spark.kubernetes.file.upload.path: /workdir
  driver:
    cores: 1
    coreLimit: "1200m"
    memory: "512m"
    labels:
      version: 3.1.1
    serviceAccount: {{ .Release.Name }}
    volumeMounts:
      {{- include "codeflare.dev/workdir.volumeMount" . | indent 6 }}
    {{- include "codeflare.dev/workdir.path" . | indent 4 }}
     
  executor:
    cores: {{ .Values.workers.cpu }}
    instances: {{ .Values.workers.count }}
    memory: {{ .Values.workers.memory }}

    {{- if and (.Values.workers.gpu) (gt .Values.workers.gpu 0) }}
    gpu:
      name: "nvidia.com/gpu"
      quantity: {{ .Values.workers.gpu }}
    {{- end }}

    labels:
      version: 3.1.1
    volumeMounts:
      {{- include "codeflare.dev/workdir.volumeMount" . | indent 6 }}
    {{- include "codeflare.dev/workdir.path" . | indent 4 }}
{{- end }}
