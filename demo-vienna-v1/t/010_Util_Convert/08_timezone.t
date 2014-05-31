use strict;
use Test::Base;
use AnaVanet::Util::Convert;

plan tests => 1*blocks;

filters { input    => qw/yaml/, 
          expected => qw/chomp/ };

run {
    my $block = shift;
    my $timezone = AnaVanet::Util::Convert::_get_timezone( $block->input );
    is $timezone, $block->expected;
};


__END__
===
--- input
-time: 18:00:00
-date: 3/2/2011
-dateL: 3/2/2011
-timeL: 19:00:00
--- expected
1

===
--- input
-time: 18:52:18
-date: 3/2/2011
-dateL: 3/2/2011
-timeL: 19:51:57
--- expected
1

