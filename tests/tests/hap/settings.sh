# hap test
api=ray
expected=('estimated_memory_footprint')
namespace=codeflare-watsonxai-preprocessing

if which lspci && lspci | grep -iq nvidia; then
    expected+=('running in GPU mode' 'torch.cuda.is_available(): True')
else
    expected+=('running in CPU-only mode')
fi
