#!/usr/bin/env bash

SETTINGS_SCRIPTDIR="$( dirname -- "$BASH_SOURCE"; )"

# for the internal S3 (via Minio), whose helm templates are located in platform/s3
HELM_DEMO_SECRETS="--set global.s3AccessKey=codeflarey --set global.s3SecretKey=codeflarey --set global.s3Endpoint=http://s3.$NAMESPACE_SYSTEM.svc.cluster.local:9000 --set global.buckets.test=internal-test-bucket"

if [[ -f "$SETTINGS_SCRIPTDIR"/my.secrets.sh ]]
then
    . "$SETTINGS_SCRIPTDIR"/my.secrets.sh

    if [[ -n "$IMAGE_REGISTRY" ]] && [[ -n "$JAAS_IPS_USER" ]] && [[ -n "$JAAS_IPS_PASSWORD" ]]
    then
        jaas_dockerconfigjson=$(cat <<EOF | base64 | tr -d \\n
{       
    "auths":
    {
        "$IMAGE_REGISTRY":
            {
                "auth":"$(echo -n "$JAAS_IPS_USER:$JAAS_IPS_PASSWORD" | base64 | tr -d \\n)"
            }
    }
}
EOF
                             )
        HELM_IMAGE_PULL_SECRETS="--set global.jaas.dockerconfigjson=$jaas_dockerconfigjson --set global.jaas.ips=jaas-image-pull-secret"
    fi

    
    HELM_SECRETS="$HELM_DEMO_SECRETS --set global.buckets.test=internal-test-bucket --set cosAccessKey=$COS_ACCESS_KEY --set cosSecretKey=$COS_SECRET_KEY --set github_ibm_com.secret.user=$AI_FOUNDATION_GITHUB_USER --set github_ibm_com.secret.pat=$AI_FOUNDATION_GITHUB_PAT"
else
    echo "Skipping my.secrets.sh"
    HELM_SECRETS="$HELM_DEMO_SECRETS"
fi
