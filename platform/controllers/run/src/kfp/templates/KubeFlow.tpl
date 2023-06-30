{{- define "codeflare.dev/KubeFlowJob" }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: kubeflow
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/part-of: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: codeflare.dev
spec:
  completions: 1
  parallelism: 1
  ttlSecondsAfterFinished: 100 # give some time for tests
  backoffLimit: 4
  template:
    metadata:
      labels:
        app.kubernetes.io/component: kubeflow
        app.kubernetes.io/name: {{ .Values.name }}
        app.kubernetes.io/part-of: {{ .Values.name }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        app.kubernetes.io/managed-by: codeflare.dev
        {{ if .Values.datasets }}
{{ .Values.datasets | b64dec | indent 8 }}
        {{ end }}
    spec:
      restartPolicy: OnFailure
      volumes:
        {{- include "codeflare.dev/workdir.volume" . | indent 8 }}
      containers:
        - name: kubeflow
          image: {{ .Values.image }}
          env:
            - name: KFP_ENDPOINT
              value: http://ml-pipeline-ui.kubeflow.svc.cluster.local
            - name: KFP_EXPERIMENT_NAME
              value: {{ .Values.name }}
            - name: KFP_PIPELINE_NAME
              value: {{ .Release.Name }}
            - name: KFP_SCRIPT
              value: {{ .Values.script }}
          {{- include "codeflare.dev/workdir.path" . | indent 10 }}
          volumeMounts:
            {{- include "codeflare.dev/workdir.volumeMount" . | indent 12 }}
          command:
            - /bin/bash
            - "-c"
            - "--"
            - |
              set -e
              set -o pipefail
              cd /workdir
              kfp dsl compile --py $KFP_SCRIPT --output /tmp/pipeline.yaml --function main
              kfp --endpoint $KFP_ENDPOINT \
                run create \
                --experiment-name $KFP_EXPERIMENT_NAME \
                --pipeline-name $KFP_PIPELINE_NAME \
                --package-file /tmp/pipeline.yaml \
                --watch
{{- end }}
