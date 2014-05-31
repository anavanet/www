use strict;
use Test::Base;
use AnaVanet::Util::Convert;

plan tests => 1*blocks;

filters { input    => qw/chomp/, 
          expected => qw/yaml/ };

run {
    my $block = shift;
    my $conv  = AnaVanet::Util::Convert->new( $block->input );
    my $data_ref = AnaVanet::Util::Convert::_get_data_from_old_snapshot( $conv->get_old_snapshot_ref(0) );
    is_deeply $data_ref, $block->expected;
};


__END__
=== UDP
--- input
t/xmls/udp.xml
--- expected 
time: 1296759138
jitter: 11.746
bandwidth: 0.0
bytes: 0
rtt: 0
req_pdr: 0.0 
nemo_stat: 0
nodes:
  - node_id: RSU2
    name: RSU2
    lat: 48.83815002441406
    lng: 2.0986740216612816
    speed: 0.0
  - node_id: RSU1
    name: RSU1
    lat: 48.83770191669464
    lng: 2.101257346570492
    speed: 0.0
  - node_id: MR3
    name: MR3
    lat: 48.837234795093536
    lng: 2.0998793989419937
    speed: 18.55704
links: 
  - src: MR3
    dest: RSU1
    name: MR3_RSU1
    distance: 113.57672053101231
    req_pdr: 0
    res_pdr: ~
  - src: MR3
    dest: RSU2
    name: MR3_RSU2
    distance: ~
    req_pdr: 1.0
    res_pdr: ~
  - src: RSU1
    dest: RSU2
    name: RSU1_RSU2
    distance: 195.7590989206364
    req_pdr: ~
    res_pdr: ~

=== PING
--- input
t/xmls/ping.xml
--- expected
time: 1303883952
jitter: 0
bandwidth: 0
bytes: 64
rtt: 3.78
req_pdr: 0.0 
nemo_stat: 0
nodes:
  - node_id: MR1
    name: MR1
    lat: 34.73193383216858
    lng: 135.73369348049164
    speed: 1.433448
  - node_id: MR2
    name: MR2
    lat: 34.731985330581665
    lng: 135.73398900032043
    speed: 0.40373600000000004
links: 
  - src: MR1
    dest: MR2
    name: MR1_MR2
    distance: 27.639465545848388
    req_pdr: 1.0 
    res_pdr: 1.0 

=== TCP
--- input
t/xmls/tcp.xml
--- expected
time: 1224168241
jitter: 0
bandwidth: 2578944.0
bytes: 322368
rtt: 0
req_pdr: 0 
nemo_stat: ~
nodes:
  - node_id: MR1
    name: MR1
    lat: 48.83655542135239
    lng: 2.09953336417675
    speed: 8.40808
  - node_id: MR2
    name: MR2
    lat: 48.83649438619614
    lng: 2.100131466984749
    speed: 6.6672
  - node_id: MR3
    name: MR3
    lat: 48.83663046360016
    lng: 2.10058256983757
    speed: 4.20404
links: 
  - src: MR2
    dest: MR3
    name: MR2_MR3
    distance: 36.361950348810325
    req_pdr: ~
    res_pdr: ~
  - src: MR1
    dest: MR2
    name: MR1_MR2
    distance: 44.35141056270317
    req_pdr: ~
    res_pdr: ~

