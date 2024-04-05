# hapq test
app=git@github.ibm.com:cloud-computer/lunchpail-hapq.git
branch=v0.0.1
expected=('HAPq processing input_file=')

if which lspci && lspci | grep -iq nvidia; then
    expected+=('running in GPU mode')
else
    expected+=('running in CPU-only mode')
fi
