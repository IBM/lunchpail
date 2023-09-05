# hapq test
expected=('HAPq processing input_file=')
namespace=codeflare-watsonxai-preprocessing

if which lspci && lspci | grep -iq nvidia; then
    expected+=('running in GPU mode')
else
    expected+=('running in CPU-only mode')
fi
