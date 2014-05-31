#!/opt/local/bin/perl
use strict;
use warnings;
# use FindBin::Real;
# use lib FindBin::Real::Bin() . '/lib';
use lib qw/ lib /;
use CGI;
use CGI::Carp qw/ fatalsToBrowser /;
use AnaVanet::WWW::API;

my $q = CGI->new;
my $api = AnaVanet::WWW::API->new( $q );
my $req_method = $q->request_method();
my @keys = $q->param;

    #print $q->header(-type => "text/html; charset=utf-8");
    #print "Content-Type: text/html; charset=utf-8\n\n";
    #print "hello\n";
    #print "<html><body><div>hello</div></body></html>";

my %func_mode = (
    GET => {
        'analysis'      => sub{ $api->analize_exp() },
        'data'          => sub{ $api->get_data() },
        'oldxml'        => sub{ $api->get_oldxml() },
        'convert'       => sub{ $api->convert() },
        'default'       => sub{ $api->show_index_page() }
    },
    POST => {
        'upload'        => sub{ $api->upload_exp_data() }
    }
);

# select function mode
my $exec_func = $func_mode{$req_method}{'default'};
for my $key (@keys) {
    if( defined $func_mode{$req_method}{$key} ) {
        $exec_func = $func_mode{$req_method}{$key};
        last;
    }
}

# execute function
&{ $exec_func };
