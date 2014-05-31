#!/usr/bin/perl
use strict;
use warnings;
use lib qw/ lib /;
use AnaVanet::Util::Convert;

show_how_to() unless $ARGV[0];
my $file = $ARGV[0];
die(qq/Not found '$file'\n/) unless -e $file;

if( $file =~ m{\.xml}i) {
    my $conv = AnaVanet::Util::Convert->new( $file );
    print $conv->get_all_data("JSON");
}
else {
    print qq/Need XML, not '$file'\n/;
}

####################
sub show_how_to {
    print "usage: $0 [AnaVanet XML file]", "\n"; # $0 means 'program name'
}
