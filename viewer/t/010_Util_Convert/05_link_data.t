use strict;
use Test::Base;
use AnaVanet::Util::Convert;

plan tests => 1*blocks;

filters { input    => qw/yaml/, 
          expected => qw/yaml/ };

run {
    my $block = shift;
    my $links_ref = AnaVanet::Util::Convert::_get_links_data_from_old_snapshot( $block->input );
    is_deeply $links_ref, $block->expected;
};


__END__
===
--- input
-distance_MR3_RSU1: 113.57672053101231
-PDRlink_MR3_RSU1: 0
--- expected 
- src: MR3
  dest: RSU1
  name: MR3_RSU1
  distance: 113.57672053101231
  req_pdr: 0
  res_pdr: ~

===
--- input
-distance_RSU1_MR3: 113.57672053101231
-PDRlink_MR3_RSU1: 0
--- expected 
- src: MR3
  dest: RSU1
  name: MR3_RSU1
  distance: 113.57672053101231
  req_pdr: 0
  res_pdr: ~

===
--- input
-jitter: 11.746
-distance_MR3_RSU1: 113.57672053101231
-speed_RSU2: 0.0
-speed_MR3: 18.55704
-lng_RSU2: 2.0986740216612816
-distance_RSU1_RSU2: 195.7590989206364
-speed_RSU1: 0.0
-bandwidth: 0.0
-rtt: 0
-time: 18:52:18
-NEMO_status: 0
-PDRlink_RSU1_RSU1: 0
-date: 3/2/2011
-dateL: 3/2/2011
-lng_MR3: 2.0998793989419937
-PDRlink_RSU2_RSU2: 0.0
-timeL: 19:51:57
-lat_RSU2: 48.83815002441406
-bytes: 0
-lat_RSU1: 48.83770191669464
-PDRlink_MR3_RSU2: 1.0
-lng_RSU1: 2.101257346570492
-lat_MR3: 48.837234795093536
-PDR: 0.0
-PDRlink_MR3_RSU1: 0
--- expected 
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
