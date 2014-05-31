#!/usr/bin/perl
use strict;
use warnings;
use FindBin::Real;
use lib FindBin::Real::Bin() . '/lib';
use CGI;
use CGI::Carp qw/ fatalsToBrowser /;
use AnaVanet::WWW::API;

my $q = CGI->new;
my $api = AnaVanet::WWW::API->new( $q );
my $req_method = $q->request_method();
my @keys = $q->param;

my %func_mode = (
    GET => {
        'analysis'      => sub{ $api->analize_exp() },
        'data'          => sub{ $api->get_data() },
        'rssi'          => sub{ $api->rssi_heatmap() },
        'rssiData'      => sub{ $api->get_rssi_data() },
        'oldxml'        => sub{ $api->get_oldxml() },
        'convert'       => sub{ $api->convert() },
#        'default'       => sub{ $api->show_index_page() }
    },
    POST => {
        'explanation'   => sub{ $api->update_explanation() },
        'upload'        => sub{ $api->upload_exp_data() }
    }
);

# select function mode
my $exec_func = $func_mode{$req_method}{'analysis'};
for my $key (@keys) {
    if( defined $func_mode{$req_method}{$key} ) {
        $exec_func = $func_mode{$req_method}{$key};
        last;
    }
}

# execute function
&{ $exec_func };
