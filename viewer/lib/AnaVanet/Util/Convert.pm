package AnaVanet::Util::Convert;
use strict;
use warnings;
use Carp;
use Time::Local;
use XML::TreePP;
use JSON::XS;
use base qw/ Class::Accessor::Fast /;
__PACKAGE__->mk_accessors( qw/ old_xml_tree 
                               data_num 
                               exp_type
                               / );

##############################
sub new {
    my $self = shift;
    my $file = shift;
    return $self->SUPER::new({}) unless $file;

    my $tree_ref = _get_xml_tree( $file );
    my $exp_type = _get_exp_type( $file ) || 'UNKNOWN';
    my $num   = scalar @{$tree_ref->{'markers'}->{'marker'}};
    return $self->SUPER::new({ old_xml_tree => $tree_ref, 
                               data_num     => $num,
                               exp_type     => $exp_type });
}

##############################
sub read_old_format {
    my $self = shift;
    my $file = shift || croak("input AnaVanet XML file\n");

    my $tree_ref = _get_xml_tree($file);
    my $exp_type = _get_exp_type( $file ) || 'UNKNOWN';
    my $num   = scalar @{$tree_ref->{'markers'}->{'marker'}};
    $self->old_xml_tree( $tree_ref );
    $self->data_num( $num );
    $self->exp_type( $exp_type );
    return 1;
}

##############################
sub get_nodes_ref {
    my $self         = shift;
    my $node_ref     = [];
    my $snapshot_ref = $self->get_old_snapshot_ref( 0 );

    for my $attr (keys %$snapshot_ref){
        if( $attr =~ /^-speed_([^_]+)$/ ) { # pick up name of node from speed-tag
            my $node = $1;
            push(@$node_ref, $node);
        }
    }
    return $node_ref;
}


##############################
sub get_all_data_ref {
    my $self = shift;
    my $exp_results_ref = $self->get_exp_data_from_old_snapshot();
    my $data_ref = [];
    for my $num ( 0 .. ($self->data_num-1) ) {
        push( @$data_ref, 
              _get_data_from_old_snapshot( $self->get_old_snapshot_ref($num) ));
    }
    $exp_results_ref->{'data'} = $data_ref;
    return $exp_results_ref;
}

##############################
sub get_all_data {
    my $self   = shift;
    my $format = shift || 'json';

    my $all_data_ref = $self->get_all_data_ref();
    my $dispatcher = {
        json    => sub{ _format_json( $all_data_ref ) },
        xml     => sub{ _format_xml( $all_data_ref ) },
        default => sub{ _format_json( $all_data_ref ) }
    };
    my $func = 'default';
    if( $format =~ /(json|xml)/i ) {
        $func = lc $1;
    }
    return &{$dispatcher->{$func}};
}


##############################
sub _format_json {
    my $data_ref = shift;
    return JSON::XS->new->utf8->encode( $data_ref );
}

#TODO implement xml version
##############################
sub _format_xml {
    return "xml";
}

##############################
sub get_old_snapshot_ref {
    my $self = shift;
    my $num  = shift;
    return $self->old_xml_tree->{'markers'}->{'marker'}->[$num];
}


##############################
sub _get_exp_type {
    my $file_name = shift || return;
    my $exp_type  = {
        tcp  => 'TCP',
        udp  => 'UDP',
        ping => 'ICMP' };

    if( $file_name =~ m/(tcp|udp|ping)/i ) {
        my $key = lc $1;
        return $exp_type->{$key};
    }
    return;
}


##############################
sub get_exp_data_from_old_snapshot {
    my $self = shift;
    my $old_snapshot_ref = shift || $self->get_old_snapshot_ref(0);
    my $exp_id = _get_unix_time( { date => $old_snapshot_ref->{'-date'},
                                   time => $old_snapshot_ref->{'-time'} });

    my $name   = sprintf("[%s] %s %s",  $self->exp_type,
                                        $old_snapshot_ref->{'-date'},
                                        $old_snapshot_ref->{'-time'} );
    my $node_num = scalar @{$self->get_nodes_ref()};
    my $exp_ref = { exp_id      => $exp_id,
                    name        => $name,
                    exp_type    => $self->exp_type,
                    node_num    => $node_num,
                    timezone    => _get_timezone( $old_snapshot_ref ),
                    explanation => $name 
    };
    return $exp_ref;
}

##############################
sub _get_timezone {
    my $old_snapshot_ref = shift || return;
    my $unixtime  = _get_unix_time({ date => $old_snapshot_ref->{'-date'},
                                     time => $old_snapshot_ref->{'-time'} });
    my $localtime = _get_unix_time({ date => $old_snapshot_ref->{'-dateL'},
                                     time => $old_snapshot_ref->{'-timeL'} });
    my $timezone = sprintf("%d", ($localtime - $unixtime) / 3600 + 0.5 );
    #my $timezone = int( ($localtime - $unixtime) / 3600 + 0.5 );
    return $timezone;
}

##############################
sub _get_data_from_old_snapshot {
    my $old_snapshot_ref = shift || return;
    my $temp_data_ref = {};
    for my $key (keys %$old_snapshot_ref) {
        if( $key =~ /^(-jitter|-PDR|-rtt|-bandwidth|-bytes|-NEMO_status|-date|-time)$/ ){
            my $tag = $1;
            $temp_data_ref->{$tag} = $old_snapshot_ref->{$key};
        }
    }
    my $unixtime = _get_unix_time( { date => $temp_data_ref->{'-date'},
                                     time => $temp_data_ref->{'-time'} });
    my $data_ref = { time        => $unixtime,
                     jitter      => $temp_data_ref->{'-jitter'},
                     rtt         => $temp_data_ref->{'-rtt'},
                     bandwidth   => $temp_data_ref->{'-bandwidth'},
                     bytes       => $temp_data_ref->{'-bytes'},
                     req_pdr     => $temp_data_ref->{'-PDR'},
                     nemo_stat   => $temp_data_ref->{'-NEMO_status'},
                     nodes       => _get_nodes_data_from_old_snapshot( $old_snapshot_ref ),
                     links       => _get_links_data_from_old_snapshot( $old_snapshot_ref )
    };
    return $data_ref;
}


##############################
sub _get_nodes_data_from_old_snapshot {
    my $old_snapshot_ref = shift || return;
    my $nodes_ref     = [];
    my $temp_data_ref = {};
    for my $key (keys %$old_snapshot_ref) {
        if( $key =~ /^(-speed|-lat|-lng)_([^_]+)$/ ){
            my $tag  = $1;
            my $node = $2;
            $temp_data_ref->{$node}->{$tag} = $old_snapshot_ref->{$key};
        }
    }

    for my $node (keys %$temp_data_ref) {
        push( @$nodes_ref, { node_id => $node, #id is name of node on old version
                             name    => $node,
                             lat     => $temp_data_ref->{$node}->{'-lat'},
                             lng     => $temp_data_ref->{$node}->{'-lng'},
                             speed   => $temp_data_ref->{$node}->{'-speed'} });
    }
    return $nodes_ref;
}

##############################
sub _get_links_data_from_old_snapshot {
    my $old_snapshot_ref = shift || return;
    my $links_ref = [];
    my $temp_data_ref = {};
    for my $key (keys %$old_snapshot_ref) {
        if( $key =~ /^(-distance|-PDRlink|)_([^_x]+)(x?)_([^_x]+)(x?)$/ ){
            if( $2 eq $4 ) { next; } # ignore if source node and destination node is the same
            my $tag      = $1;
            my $res_flag = $3 || $5;
            my @nodes    = sort ($2, $4);
            my $link     = join('_', @nodes);
            if( $res_flag ) {
                $temp_data_ref->{$link}->{'res_pdr'} = $old_snapshot_ref->{$key};
            }
            else {
                $temp_data_ref->{$link}->{$tag} = $old_snapshot_ref->{$key};
            }
        }
    }

    for my $link (keys %$temp_data_ref) {
        my ($src, $dest) = $link =~ /^([^_]+)_([^_]+)$/;
        push( @$links_ref, { src      => $src,
                             dest     => $dest,
                             name     => $link,
                             distance => $temp_data_ref->{$link}->{'-distance'},
                             req_pdr  => $temp_data_ref->{$link}->{'-PDRlink'},
                             res_pdr  => $temp_data_ref->{$link}->{'res_pdr'} });
    }
    return $links_ref;
}

##############################
sub _get_nodes_names_ref {
    my $snapshot_ref = shift || return;
    my $nodes_names_ref     = [];

    for my $attr (keys %$snapshot_ref){
        #if( $attr =~ /^$tags->{'speed'}_([^-]+)$/ ) { # pick up name of node from speed-tag
        if( $attr =~ /^-speed_([^_]+)$/ ) { # pick up name of node from speed-tag
            my $node = $1;
            push(@$nodes_names_ref, $node);
        }
    }
    return $nodes_names_ref;
}

##############################
sub _get_unix_time {
    my $t = shift || return;
    my @time = $t->{'time'} =~ m{(\d+):(\d+):(\d+)$}; # hour:min:sec
    my @date = $t->{'date'} =~ m{(\d+)/(\d+)/(\d+)$}; # day/mon/year
    $date[1]--; # decrement month
    my @unixtime = reverse @time;
    push( @unixtime, @date );
    return timegm( @unixtime );
}
    

##############################
sub _get_xml_tree {
    my $file = shift || croak("input xml file\n");
    open my $fh, '<', $file;
    my $tree = XML::TreePP->new();
    $tree->set( use_ixhash => 1 );    # keep the order of xml(markers)
    my $xml_hash = $tree->parsefile( $file );
    return $xml_hash;
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

AnaVanet::WWW::API

=head1 LICENSE

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl itself.

=cut
