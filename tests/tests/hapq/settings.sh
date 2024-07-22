# hapq test
app=git@github.com:IBM/lunchpail-hapq.git
branch=v0.1.5
deployname=lunchpail-hapq
expected=('Epoch 0: 0%')

if which lspci && lspci | grep -iq nvidia; then
    expected+=('running in GPU mode')
else
    expected+=('running in CPU-only mode')
fi
