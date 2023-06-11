{{- define "ray.io/RayJob" }}
apiVersion: ray.io/v1alpha1
kind: RayJob
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/component: ray
    app.kubernetes.io/name: {{ .Values.name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
spec:
  jobId: {{ .Release.Name }}
  entrypoint: {{ .Values.entrypoint }}
  shutdownAfterJobFinishes: true
  ttlSecondsAfterFinished: 10
  # runtimeEnv decoded to '{
  #    "pip": [
  #        "requests==2.26.0",
  #        "pendulum==2.1.2"
  #    ],
  #    "env_vars": {
  #        "counter_name": "test_counter"
  #    }
  #}'
  runtimeEnv: {{ .Values.runtimeEnv }}
  rayClusterSpec:
    rayVersion: '2.1.0' # should match the Ray version in the image of the containers
    # Ray head pod template
    headGroupSpec:
      # The `rayStartParams` are used to configure the `ray start` command.
      # See https://github.com/ray-project/kuberay/blob/master/docs/guidance/rayStartParams.md for the default settings of `rayStartParams` in KubeRay.
      # See https://docs.ray.io/en/latest/cluster/cli.html#ray-start for all available options in `rayStartParams`.
      rayStartParams:
        dashboard-host: '0.0.0.0'
      #pod template
      template:
        metadata:
          labels:
            app.kubernetes.io/managed-by: codeflare.dev
            app.kubernetes.io/part-of: {{ .Values.name }}
            app.kubernetes.io/instance: {{ .Release.Name }}
        spec:
          volumes:
            # You set volumes at the Pod level, then mount them into containers inside that Pod
            {{- include "ray.io/RayJob.workdir.volume" . | indent 12 }}
            {{- include "ray.io/RayJob.logging.volumes" . | indent 12 }}
          containers:
            - name: ray-head
              image: {{ .Values.image }}
              ports:
                - containerPort: 6379
                  name: gcs-server
                - containerPort: 8265 # Ray dashboard
                  name: dashboard
                - containerPort: 10001
                  name: client
                - containerPort: 8000
                  name: serve
              {{- include "ray.io/RayJob.resources" . | indent 14 }}
              {{- include "ray.io/RayJob.workdir.path" . | indent 14 }}

              volumeMounts:
                {{- include "ray.io/RayJob.workdir.volumeMount" . | indent 16 }}
                {{- include "ray.io/RayJob.logging.volumeMounts" . | indent 16 }}
            {{- include "ray.io/RayJob.logging.container" . | indent 12 }}
    workerGroupSpecs:
      # the pod replicas in this group typed worker
      - replicas: {{ .Values.workers.count }}
        minReplicas: {{ .Values.workers.count }}
        maxReplicas: {{ .Values.workers.count }}
        # logical group name, for this called small-group, also can be functional
        groupName: group
        # The `rayStartParams` are used to configure the `ray start` command.
        # See https://github.com/ray-project/kuberay/blob/master/docs/guidance/rayStartParams.md for the default settings of `rayStartParams` in KubeRay.
        # See https://docs.ray.io/en/latest/cluster/cli.html#ray-start for all available options in `rayStartParams`.
        rayStartParams: {}
        #pod template
        template:
          metadata:
            labels:
              app.kubernetes.io/managed-by: codeflare.dev
              app.kubernetes.io/part-of: {{ .Values.name }}
              app.kubernetes.io/instance: {{ .Release.Name }}
          spec:
            volumes:
            # You set volumes at the Pod level, then mount them into containers inside that Pod
            {{- include "ray.io/RayJob.workdir.volume" . | indent 12 }}

            containers:
              - name: ray-worker # must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name',  or '123-abc'
                image: {{ .Values.image }}
                lifecycle:
                  preStop:
                    exec:
                      command: [ "/bin/sh","-c","ray stop" ]
                {{- include "ray.io/RayJob.resources" . | indent 16 }}
                {{- include "ray.io/RayJob.workdir.path" . | indent 16 }}

                volumeMounts:
                  {{- include "ray.io/RayJob.workdir.volumeMount" . | indent 18 }}
{{- end }}
