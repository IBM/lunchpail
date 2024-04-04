# hap test
api=ray
app=git@github.ibm.com:cloud-computer/lunchpail-hap.git
app=git@github.ibm.com:nickm/lunchpail-hap.git
branch=initial
expected=('estimated_memory_footprint')

if which lspci && lspci | grep -iq nvidia; then
    expected+=('running in GPU mode' 'torch.cuda.is_available(): True')
else
    expected+=('running in CPU-only mode')
fi
