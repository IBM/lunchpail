{{- define "codeflare.dev/Shell" }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: shell
    app.kubernetes.io/part-of: {{ .Values.partOf }}
    app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: codeflare.dev
spec:
  completions: {{ .Values.workers.count }}
  completionMode: Indexed
  template:
    metadata:
      labels:
        app.kubernetes.io/component: shell
        app.kubernetes.io/part-of: {{ .Values.partOf }}
        app.kubernetes.io/step: {{ .Values.enclosingStep | quote }}
        app.kubernetes.io/name: {{ .Values.name }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        app.kubernetes.io/managed-by: codeflare.dev
    spec:
      restartPolicy: OnFailure
      volumes:
        {{- include "codeflare.dev/workdir.volume" . | indent 8 }}
      containers:
        - name: main
          image: {{ .Values.image }}
          command: ["/bin/bash", "-c", {{ .Values.command | quote }}]
          env:
            - name: NAME
              value: {{ .Release.Name }}
            - name: NAMESPACE
              value: {{ .Values.namespace }}
            - name: ENCLOSING_UID
              value: {{ .Values.uid }}
            - name: ENCLOSING_RUN_NAME
              value: {{ .Values.name }}
          {{- include "codeflare.dev/workdir.path" . | indent 10 }}
          volumeMounts:
            {{- include "codeflare.dev/workdir.volumeMount" . | indent 12 }}
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
