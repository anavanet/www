use strict;
use Test::Base;
use AnaVanet::Util::Convert;

plan tests => 1*blocks;

filters { input    => qw/chomp/, 
          expected => qw/yaml/ };

run {
    my $block = shift;
    my $conv  = AnaVanet::Util::Convert->new($block->input);
    my $data_ref = $conv->get_exp_data_from_old_snapshot();
    is_deeply $data_ref, $block->expected;
};


__END__
===
--- input
t/xmls/udp.xml
--- expected 
exp_id: 1296759138
name: '[UDP] 3/2/2011 18:52:18'
exp_type: UDP
node_num: 3
timezone: 1
explanation: '[UDP] 3/2/2011 18:52:18'

===
--- input
t/xmls/ping.xml
--- expected
exp_id: 1303883952
name: '[ICMP] 27/4/2011 5:59:12'
exp_type: ICMP
node_num: 2
timezone: 9
explanation: '[ICMP] 27/4/2011 5:59:12'
