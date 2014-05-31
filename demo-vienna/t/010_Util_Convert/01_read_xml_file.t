use strict;
use Test::Base;
use AnaVanet::Util::Convert;

plan tests => 1*blocks;

run {
    my $block = shift;
    my $convert_1 = AnaVanet::Util::Convert->new;
    $convert_1->read_old_format("t/xmls/udp.xml");
    my $convert_2 = AnaVanet::Util::Convert->new("t/xmls/udp.xml");
    is_deeply $convert_1->old_xml_tree, $convert_2->old_xml_tree;
};


__END__
===
