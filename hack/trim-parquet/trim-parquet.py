import sys
import pyarrow.parquet as pq

infile = sys.argv[1]
outfile = sys.argv[2]
N = int(sys.argv[3])

table = pq.read_table(infile,
                      filters=[('sentence_id', '<', N)])


pq.write_table(table, outfile)
