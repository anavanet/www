#!/usr/bin/perl
use strict;
use warnings;
use lib qw/ lib /;
use JSON::XS;
use AnaVanet::Util::Convert;

show_how_to() unless $ARGV[0];
my $file = $ARGV[0];
die(qq/Not found '$file'\n/) unless -e $file;

if( $file =~ m{\.xml}i) {
    my $conv = AnaVanet::Util::Convert->new( $file );
    my $data_ref = $conv->get_all_data_ref();
    my ($month, $day, $year) = $data_ref->{'name'} =~ m{\s(\d+)/(\d+)/(\d+)\s};
    my $date = sprintf("%02d-%02d-%02d", $year, $month, $day);
    #my $date = $data_ref->{'name'};
    my $json_name = sprintf("./data/json/%s_%s_%dnodes_%s.json",
                                $data_ref->{'exp_id'},
                                $data_ref->{'exp_type'},
                                $data_ref->{'node_num'},
                                $date );
    open my $fh, ">", $json_name;
    print $fh JSON::XS->new->utf8->encode( $data_ref );
    close $fh;
}
else {
    print qq/Need XML, not '$file'\n/;
}

####################
sub show_how_to {
    print "usage: $0 [AnaVanet XML file]", "\n"; # $0 means 'program name'
}
