use strict;
use Test::Base;
use AnaVanet::Util::Convert;

plan tests => 1*blocks;

filters { time     => qw/chomp/, 
          date     => qw/chomp/,
          expected => qw/chomp/ };

run {
    my $block = shift;
    my $unixtime = AnaVanet::Util::Convert::_get_unix_time(
                    { time => $block->time, date => $block->date });
    is $unixtime, $block->expected;
};


__END__
===
--- time 
0:0:0
--- date
1/1/1970
--- expected
0

===
--- time 
1:1:1
--- date
1/1/1970
--- expected
3661

===
--- time 
0:0:0
--- date
2/1/1970
--- expected
86400

===
--- time 
0:0:0
--- date
1/1/1971
--- expected eval
86400 * 365

=== 
--- time
18:52:18
--- date
3/2/2011
--- expected
1296759138

===
--- time
5:59:12
--- date
27/4/2011
--- expected
1303883952

===
--- time 
14:46:31
--- date
31/5/2012
--- expected
1338475591
