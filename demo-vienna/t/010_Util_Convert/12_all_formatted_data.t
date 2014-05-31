use strict;
use Test::Base;
use AnaVanet::Util::Convert;
use JSON::XS;

plan tests => 1*blocks;

filters { input    => qw/chomp/, 
          expected => qw/yaml/ };

run {
    my $block = shift;
    my $conv  = AnaVanet::Util::Convert->new( $block->input );
    my $all_data_json = $conv->get_all_data();
    my $ref = JSON::XS->new->utf8->decode($all_data_json);
    is_deeply $ref, $block->expected;
};

__END__
=== UDP
--- input
t/xmls/udp.xml
--- expected 
exp_id: 1296759138
name: '[UDP] 3/2/2011 18:52:18'
exp_type: UDP
node_num: 3
timezone: 1
explanation: '[UDP] 3/2/2011 18:52:18'
data:
  - time: 1296759138
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

  - time: 1296759141
    jitter: 11.746
    bandwidth: 0.0
    bytes: 0
    rtt: 0
    req_pdr: 0.0 
    nemo_stat: 2
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
        lat: 48.837195456027985
        lng: 2.09965630620718
        speed: 21.98324
    links: 
      - src: MR3
        dest: RSU1
        name: MR3_RSU1
        distance: 130.16480498214298
        req_pdr: 0
        res_pdr: ~
      - src: MR3
        dest: RSU2
        name: MR3_RSU2
        distance: ~
        req_pdr: 0.99
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
exp_id: 1303883952
name: '[ICMP] 27/4/2011 5:59:12'
exp_type: ICMP
node_num: 2
timezone: 9
explanation: '[ICMP] 27/4/2011 5:59:12'
data: 
  - time: 1303883952
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

  - time: 1303883957
    jitter: 0
    bandwidth: 0
    bytes: 64
    rtt: 4.15
    req_pdr: 0.0 
    nemo_stat: 0
    nodes:
      - node_id: MR1
        name: MR1
        lat: 34.7319301366806
        lng: 135.7337183356285
        speed: 0.6204200000000001
      - node_id: MR2
        name: MR2
        lat: 34.73199051618576
        lng: 135.73398131132126
        speed: 0.505596
    links: 
      - src: MR1
        dest: MR2
        name: MR1_MR2
        distance: 24.98207191908182
        req_pdr: 1.0 
        res_pdr: 1.0 


