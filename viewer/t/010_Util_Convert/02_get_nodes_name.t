use strict;
use Test::Base;
use AnaVanet::Util::Convert;

plan tests => 1*blocks;

filters { input    => qw/chomp/,
          expected => qw/yaml/ };

run {
    my $block = shift;
    my $convert = AnaVanet::Util::Convert->new( $block->input );
    my @sorted_nodes = sort @{$convert->get_nodes_ref()};
    is_deeply [@sorted_nodes], $block->expected;
    #is_deeply \@sorted_nodes, $block->expected; # <- the same as above
};


__END__
===
--- input 
t/xmls/udp.xml
--- expected Sort
- RSU1
- RSU2
- MR3

===
--- input 
t/xmls/ping.xml
--- expected Sort
- MR1
- MR2

===
--- input 
t/xmls/tcp.xml
--- expected Sort
- MR1
- MR2
- MR3
