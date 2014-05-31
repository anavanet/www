package AnaVanet::WWW::API;
use strict;
use warnings;
use Carp;
use File::Basename;
use Try::Tiny;
use File::Copy;
use URI::Escape;
use Text::Xslate;
use Time::Local;
use JSON::XS;
use AnaVanet::Util::Convert;
use base qw/ Class::Accessor::Fast /;
__PACKAGE__->mk_accessors( qw/ q / );


#------------------------------
sub new {
    my $self = shift;
    my $q    = shift || croak("input CGI instance\n");
    return $self->SUPER::new({ q => $q });
}

#------------------------------
sub show_index_page {
    my $self = shift;
    my $q = $self->q;
    my $all_exp_info_ref = _get_all_exp_info();

    # use Data::Dumper;
    # print Dumper $all_exp_info_ref;

    my $tx = Text::Xslate->new();
    #my $tx = Text::Xslate->new({cache_dir => '.xslate_cache/'});
    print $q->header(-type => "text/html; charset=utf-8");
    #print "Content-Type: text/html; charset=utf-8\n\n";
    print $tx->render('template/index-page-tx.html', { all_exp => $all_exp_info_ref });
}

#------------------------------
sub analize_exp {
    my $self = shift;
    my $q = $self->q;
    my $exp_id = $q->param('analysis') || return;

    my $tx = Text::Xslate->new();
#    my $tx = Text::Xslate->new({cache_dir => '.xslate_cache/'});
    my $var = {
        exp_id => $exp_id
    };
    print $q->header(-type => "text/html; charset=utf-8");
    if( _is_exp( $exp_id ) ) {
        print $tx->render('template/analysis-exp-tx.html', $var);
    }
    else {
        print $tx->render('template/not-found-exp-tx.html', $var);
    }
}

#------------------------------
sub get_data {
    my $self = shift;
    my $q    = $self->q;
    my $exp_id = $q->param('data') || return;
    my $format = $q->param('format') || 'json';
    my $exp_data = _get_exp_data({ exp_id => $exp_id, format => $format });
    print $q->header(-type => "text/plain; charset=utf-8");
    if( defined $exp_data ){
        print $exp_data;
    }
    else {
        print "Not found the experiment data [ID: $exp_id]";
    }
}

#------------------------------
sub get_oldxml {
    my $self = shift;
    my $q    = $self->q;
    my @files = glob("./data/upload/*.xml ./data/upload/*.XML");
    if( @files ) {
        my @files = map{ basename($_) } @files;
        print $q->header(-type => 'text/plain; charset=utf8');
        print JSON::XS->new->encode( {status => 'ok', files => [@files]} );
    }
    else {
        my $mes = "FAIL: there are no old AnaVANET XML files";
        print $q->header(-type => 'text/plain; charset=utf8');
        print JSON::XS->new->encode( {status => 'fail', message => $mes} );
    }
}

#------------------------------
sub upload_exp_data {
    my $self    = shift;
    my $q       = $self->q;

    my $save_dir = './data/upload';
    my $filename = basename( $q->param('upload') );
    if( $filename =~ /^[._-\w]+\.xml$/i ) {
        my $newfile  = "$save_dir/$filename";
        if( -e $newfile ) {
            my $mes = "FAIL: upload\n";
            $mes   .= "The same name of file is found\n";
            $mes   .= "First you have to convert AnaVANET XML file";
            print $q->header(-type => 'text/plain; charset=utf8');
            print JSON::XS->new->encode( {status => 'fail', message => $mes} );
        }
        else {
	try {
            my $fh = $q->upload('upload');
            copy( $fh, $newfile );
            print $q->header(-type => 'text/plain; charset=utf8');
            print JSON::XS->new->encode( {status => 'ok', file => $filename} );
	}
	catch {
	    croak("FAIL: copy, $_\n");
	};

        }
    }
    else {
        my $mes = "FAIL: upload\n";
        $mes   .= "AnaVANET XML data is needed\n";
        $mes   .= "file name should be alphabets/numbers";
        print $q->header(-type => 'text/plain; charset=utf8');
        print JSON::XS->new->encode( {status => 'fail', message => $mes} );
    }
}

#------------------------------
sub convert {
    my $self = shift;
    my $q    = $self->q;

    my $old_dir  = './data/upload';
    my $filename = $q->param('convert');
    my $old_data = "$old_dir/$filename";
    unless( -e $old_data ) {
        print $q->header(-type => 'text/plain; charset=utf8');
        print JSON::XS->new->encode( {status => 'fail'} );
        return;
    }

    my $conv = AnaVanet::Util::Convert->new( $old_data );
    my $data_ref = $conv->get_all_data_ref();
    my ($month, $day, $year) = $data_ref->{'name'} =~ m{\s(\d+)/(\d+)/(\d+)\s};
    my $date = sprintf("%02d-%02d-%02d", $year, $month, $day);
    #my $date = $data_ref->{'name'};
    my $json_name = sprintf("./data/json/%s_%s_%dnodes_%s.json",
                                $data_ref->{'exp_id'},
                                $data_ref->{'exp_type'},
                                $data_ref->{'node_num'},
                                $date );
    
    my $fail_mes;
    try {
        open my $fh, ">", $json_name;
        print $fh JSON::XS->new->utf8->encode( $data_ref );
        close $fh;
        unless( unlink $old_data ) {
            croak("fail to delete old XML data");
        }
    }
    catch {
        $fail_mes = $_;
        carp("FAIL: convert, $fail_mes\n");
    };

    if( $fail_mes ) {
        print $q->header(-type => 'text/plain; charset=utf8');
        print JSON::XS->new->encode( {
            status  => 'fail', 
            message => "FAIL: convert\n$fail_mes"} );
    }
    else {
        my $exp_name = sprintf("%s_%dnodes", $data_ref->{'exp_type'}, $data_ref->{'node_num'});
        print $q->header(-type => 'text/plain; charset=utf8');
        print JSON::XS->new->encode( {
            status => 'ok', 
            exp_id => $data_ref->{'exp_id'},
            name   => $exp_name,
            date   => $date,
            file => $filename} );
    }
}

#------------------------------
sub _get_exp_data {
    my $param_ref = shift;
    my @json_files = glob("data/json/*.json");
    my ($target_file) = grep{ /$param_ref->{'exp_id'}_/ } @json_files;
    return unless $target_file;

    open my $fh, "<", $target_file;
    return do{ local $/; <$fh> };
}

#------------------------------
sub _get_all_exp_info {
    my $dir = "data/json";
    my @json_files = glob("$dir/*.json");
    @json_files = sort {$a lt $b} @json_files;

    my @all_exp_info;
    for my $json_file (@json_files) {
        my ($name, $time) = $json_file =~ m{^$dir/(\d+)_([^_]+_[^_]+)_(\d+-\d+-\d+).json$};
        push @all_exp_info, { exp_id => $1, name => $2, date => $3 };

    }
    return [ @all_exp_info ];
}

#------------------------------
sub _is_exp {
    my $exp_id = shift;
    my @json_files = glob("data/json/*.json");
    (my $target_file) = grep{ /(?:$exp_id)_/ } @json_files;
    return unless $target_file;
    
    return 1;
}

1;


__END__

=head1 AUTHOR

Satoshi MATSUURA

=head1 COPYRIGHT

The following copyright notice applies to all the files provided in
this distribution, including binary files, unless explicitly noted
otherwise.

Copyright (c) 2012 Nara Institute of Science and Technology (NAIST)

=head1 SEE ALSO

AnaVanet::Util::Convert

=head1 LICENSE

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl itself.

=cut
