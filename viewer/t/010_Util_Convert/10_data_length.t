use strict;
use Test::Base;
use AnaVanet::Util::Convert;

plan tests => 1*blocks;

filters { input    => qw/chomp/, 
          expected => qw/chomp/ };

run {
    my $block = shift;
    my $conv  = AnaVanet::Util::Convert->new( $block->input );
    is $conv->data_num, $block->expected;
};


__END__
===
--- input
t/xmls/ping.xml
--- expected
2

===
--- input
t/xmls/udp.xml
--- expected
2

===
--- input
t/xmls/tcp.xml
--- expected
2

===
--- input
t/xmls/ping_org.xml
--- expected
6

===
--- input
t/xmls/udp_org.xml
--- expected
4

===
--- input
t/xmls/tcp_org.xml
--- expected
6

