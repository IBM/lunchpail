# simple gpu test
if lspci | grep -iq nvidia; then
    expected=('Test PASSED')
fi
