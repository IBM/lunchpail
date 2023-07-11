#!/usr/bin/env bash

if ! which jq > /dev/null; then
    # TODO generalize? this is for the cancellation handler for CI/CD
    curl -L https://github.com/jqlang/jq/releases/download/jq-1.6/jq-linux64 > /usr/local/bin/jq
    chmod +x /usr/local/bin/jq
fi

vsi_id=$(echo -n "$1" | jq -r .vsi_id)
ip_id=$(echo -n "$1" | jq -r .ip_id)
endpoint=$(echo -n "$1" | jq -r .endpoint)

echo "Getting iam token" 1>&2
iam_token=$(curl -s -X POST 'https://iam.cloud.ibm.com/identity/token' -H 'Content-Type: application/x-www-form-urlencoded' -d "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=$apikey" | jq -r .access_token)

echo "Deleting vsi $vsi_id" 1>&2
curl -X DELETE \
     "$endpoint/v1/instances/$vsi_id?version=2021-06-22&generation=2" \
     -H "Authorization: Bearer $iam_token" &

echo "Deleting ip $ip_id" 1>&2
curl -X DELETE \
     "$endpoint/v1/floating_ips/$ip_id?version=2023-07-12&generation=2&maturity=beta" \
     -H "Authorization: Bearer $iam_token"

wait
