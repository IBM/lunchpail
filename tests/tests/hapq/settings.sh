# hapq test
app="$TOP"/watsonx_ai/charts/applications/templates/preprocessing/hapq
expected=('HAPq processing input_file=')

if which lspci && lspci | grep -iq nvidia; then
    expected+=('running in GPU mode')
else
    expected+=('running in CPU-only mode')
fi
